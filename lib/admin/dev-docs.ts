import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const DOCS_ROOT = path.join(process.cwd(), 'documentation');

export interface DocMetadata {
    title?: string;
    type?: string;
    status?: string;
    owner?: string;
    priority?: string;
    progress?: number;
    [key: string]: any;
}

export interface DocNode {
    name: string;
    path: string; // Relative to DOCS_ROOT
    type: 'file' | 'directory';
    children?: DocNode[];
    metadata?: DocMetadata;
}

/**
 * Recursively read the documentation directory and build a tree structure.
 */
export async function getDocsTree(currentPath: string = ''): Promise<DocNode[]> {
    const fullPath = path.join(DOCS_ROOT, currentPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const nodes: DocNode[] = [];

    for (const entry of entries) {
        const relativePath = path.join(currentPath, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
            if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

            const children = await getDocsTree(relativePath);
            nodes.push({
                name: entry.name,
                path: relativePath,
                type: 'directory',
                children
            });
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
            const content = await fs.readFile(path.join(DOCS_ROOT, relativePath), 'utf-8');
            const { data } = matter(content);

            nodes.push({
                name: entry.name,
                path: relativePath,
                type: 'file',
                metadata: data as DocMetadata
            });
        }
    }

    // Sort: Directories first, then files by name
    return nodes.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
}

/**
 * Read a specific doc's content and metadata.
 */
export async function getDocContent(relativePath: string) {
    // Security check: Prevent path traversal
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(DOCS_ROOT, safePath);

    try {
        const fileContent = await fs.readFile(fullPath, 'utf-8');
        const { data, content } = matter(fileContent);
        return {
            metadata: data as DocMetadata,
            content,
            raw: fileContent,
            path: safePath
        };
    } catch (error) {
        console.error(`Error reading doc content at ${relativePath}:`, error);
        return null;
    }
}

/**
 * Update a specific doc's content (Super Admin only - enforced by Server Action calling this).
 */
export async function updateDocContent(relativePath: string, content: string) {
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(DOCS_ROOT, safePath);

    try {
        await fs.writeFile(fullPath, content, 'utf-8');
        return true;
    } catch (error) {
        console.error(`Error updating doc at ${relativePath}:`, error);
        return false;
    }
}

/**
 * Get flat list of all tasks (- [ ] or - [x]) across all docs.
 */
export async function getAllTasks() {
    const tree = await getDocsTree();
    const tasks: { filePath: string; title: string; checked: boolean; line: number }[] = [];

    const scan = async (nodes: DocNode[]) => {
        for (const node of nodes) {
            if (node.type === 'directory' && node.children) {
                await scan(node.children);
            } else if (node.type === 'file') {
                const fullPath = path.join(DOCS_ROOT, node.path);
                const content = await fs.readFile(fullPath, 'utf-8');
                const lines = content.split('\n');

                lines.forEach((line, index) => {
                    const match = line.match(/^(\s*)-\s*\[([ xX])] (.*)/);
                    if (match) {
                        tasks.push({
                            filePath: node.path,
                            title: match[3].trim(),
                            checked: match[2].toLowerCase() === 'x',
                            line: index + 1
                        });
                    }
                });
            }
        }
    };

    await scan(tree);
    return tasks;
}
