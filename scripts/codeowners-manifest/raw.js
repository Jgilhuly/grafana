#!/usr/bin/env node

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const { access } = require('node:fs/promises');

const { CODEOWNERS_FILE_PATH, CODEOWNERS_MANIFEST_DIR, RAW_AUDIT_JSONL_PATH } = require('./constants.js');
const { createStructuredLogger } = require('../structuredLogger');

const logger = createStructuredLogger('scripts.codeowners-manifest.raw');

/**
 * Generate raw CODEOWNERS audit data using github-codeowners CLI
 * @param {string} codeownersPath - Path to CODEOWNERS file
 * @param {string} outputPath - Path to write audit JSONL file
 */
async function generateCodeownersRawAudit(codeownersPath, outputPath) {
  try {
    await access(codeownersPath);
  } catch (error) {
    throw new Error(`CODEOWNERS file not found at: ${codeownersPath}`);
  }

  return new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(outputPath);

    const child = spawn('yarn', ['github-codeowners', 'audit', '--output', 'jsonl'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: process.cwd(),
      shell: true,
    });

    let stderrData = '';
    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    outputStream.on('error', (error) => {
      child.kill();
      reject(new Error(`Failed to write to output file: ${error.message}`));
    });

    child.stdout.pipe(outputStream);

    child.on('close', (code) => {
      outputStream.end();
      if (code === 0) {
        resolve();
      } else {
        const error = new Error(`github-codeowners process exited with code ${code}`);
        if (stderrData) {
          error.message += `\nStderr: ${stderrData.trim()}`;
        }
        reject(error);
      }
    });

    child.on('error', (err) => {
      outputStream.end();
      if (err.code === 'ENOENT') {
        reject(new Error('yarn command not found. Please ensure yarn and github-codeowners are available'));
      } else {
        reject(err);
      }
    });
  });
}

if (require.main === module) {
  (async () => {
    try {
      if (!fs.existsSync(CODEOWNERS_MANIFEST_DIR)) {
        fs.mkdirSync(CODEOWNERS_MANIFEST_DIR, { recursive: true });
      }

      logger.info('Generating raw codeowners audit data', {
        codeownersFilePath: CODEOWNERS_FILE_PATH,
        rawAuditPath: RAW_AUDIT_JSONL_PATH,
      });
      await generateCodeownersRawAudit(CODEOWNERS_FILE_PATH, RAW_AUDIT_JSONL_PATH);
      logger.info('Raw audit generated', { rawAuditPath: RAW_AUDIT_JSONL_PATH });
    } catch (e) {
      console.error('❌ Error generating raw audit:', e.message);
      process.exit(1);
    }
  })();
}

module.exports = { generateCodeownersRawAudit };
