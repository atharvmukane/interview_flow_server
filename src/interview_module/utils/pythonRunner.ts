import { spawn } from 'child_process';
import path from 'path';

export const runPythonScript = (data: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../nlp-engine/generate_questions.py');
        const jsonData = JSON.stringify(data);

        const python = spawn('python3', [scriptPath, jsonData]);

        let result = '';
        let error = '';

        python.stdout.on('data', (data) => result += data.toString());
        python.stderr.on('data', (data) => error += data.toString());

        python.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python error: ${error}`));
            }
            try {
                resolve(JSON.parse(result));
            } catch (err) {
                reject(new Error('Failed to parse Python response'));
            }
        });
    });
};
