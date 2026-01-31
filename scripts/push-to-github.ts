import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_NAME = 'tord-social';
const REPO_DESCRIPTION = 'toRd - A Social Network for AI Agents';

async function getAllFiles(dir: string, baseDir: string = dir): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  const ignoreDirs = ['node_modules', '.git', 'dist', '.cache', '.replit', '.upm', '.local', '.config', 'attached_assets'];
  const ignoreFiles = ['.env', '.env.local', 'tord-standalone.zip', '.replit', 'replit.md', 'replit.nix'];
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      if (!ignoreDirs.includes(entry.name)) {
        files.push(...await getAllFiles(fullPath, baseDir));
      }
    } else {
      if (!ignoreFiles.includes(entry.name) && !entry.name.endsWith('.log') && !entry.name.toLowerCase().includes('replit')) {
        try {
          const content = fs.readFileSync(fullPath);
          const base64Content = content.toString('base64');
          files.push({ path: relativePath, content: base64Content });
        } catch (e) {
          console.log(`Skipping binary or unreadable file: ${relativePath}`);
        }
      }
    }
  }
  
  return files;
}

async function main() {
  console.log('Getting GitHub client...');
  const octokit = await getUncachableGitHubClient();
  
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  let repo;
  try {
    const { data: existingRepo } = await octokit.repos.get({
      owner: user.login,
      repo: REPO_NAME
    });
    repo = existingRepo;
    console.log(`Repository ${REPO_NAME} already exists`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log(`Creating repository ${REPO_NAME}...`);
      const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
        name: REPO_NAME,
        description: REPO_DESCRIPTION,
        private: false,
        auto_init: true
      });
      repo = newRepo;
      console.log(`Repository created: ${newRepo.html_url}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      throw e;
    }
  }
  
  console.log('Collecting files...');
  const files = await getAllFiles(process.cwd());
  console.log(`Found ${files.length} files to upload`);
  
  let latestCommitSha: string;
  let treeSha: string;
  
  try {
    const { data: ref } = await octokit.git.getRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main'
    });
    latestCommitSha = ref.object.sha;
    
    const { data: commit } = await octokit.git.getCommit({
      owner: user.login,
      repo: REPO_NAME,
      commit_sha: latestCommitSha
    });
    treeSha = commit.tree.sha;
  } catch (e) {
    console.log('Creating initial structure...');
    latestCommitSha = '';
    treeSha = '';
  }
  
  console.log('Creating blobs...');
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner: user.login,
        repo: REPO_NAME,
        content: file.content,
        encoding: 'base64'
      });
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      if ((i + 1) % 10 === 0) {
        console.log(`Uploaded ${i + 1}/${files.length} files...`);
      }
    } catch (e) {
      console.log(`Failed to upload: ${file.path}`);
    }
  }
  
  console.log('Creating tree...');
  const { data: tree } = await octokit.git.createTree({
    owner: user.login,
    repo: REPO_NAME,
    tree: treeItems,
    base_tree: treeSha || undefined
  });
  
  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner: user.login,
    repo: REPO_NAME,
    message: 'Upload toRd social network code',
    tree: tree.sha,
    parents: latestCommitSha ? [latestCommitSha] : []
  });
  
  console.log('Updating ref...');
  try {
    await octokit.git.updateRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'heads/main',
      sha: commit.sha
    });
  } catch (e) {
    await octokit.git.createRef({
      owner: user.login,
      repo: REPO_NAME,
      ref: 'refs/heads/main',
      sha: commit.sha
    });
  }
  
  console.log(`\nSuccess! Repository: https://github.com/${user.login}/${REPO_NAME}`);
}

main().catch(console.error);
