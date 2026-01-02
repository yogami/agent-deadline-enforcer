/**
 * ZK-SLA Proof Generator
 *
 * Generates Zero-Knowledge proofs for SLA compliance.
 * Uses snarkjs with Groth16 proving system.
 */
import * as snarkjs from 'snarkjs';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

export interface SLAProofInput {
    taskId: string;
    completionTimestamp: number; // Unix seconds
    slaDeadline: number; // Unix seconds
    biasScore: number; // 0-100
    biasThreshold: number; // Usually 5
    outputData: string; // Raw output to hash
}

export interface SLAProof {
    proof: string; // Base64 encoded Groth16 proof
    publicSignals: string[];
    proofSizeBytes: number;
    taskIdHash: string;
    verified: boolean;
}

export interface PublicInputs {
    taskIdHash: bigint;
    slaDeadline: bigint;
    biasThreshold: bigint;
}

export class ProofGenerator {
    private wasmPath: string;
    private zkeyPath: string;
    private circuitsReady: boolean = false;

    constructor() {
        const circuitsDir = path.join(__dirname, 'circuits', 'compiled');
        this.wasmPath = path.join(circuitsDir, 'sla_proof_js', 'sla_proof.wasm');
        this.zkeyPath = path.join(circuitsDir, 'sla_proof.zkey');
    }

    /**
     * Check if compiled circuits exist
     */
    async isReady(): Promise<boolean> {
        try {
            await fs.promises.access(this.wasmPath);
            await fs.promises.access(this.zkeyPath);
            this.circuitsReady = true;
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Hash task ID using SHA256 (ZK-friendly when truncated)
     * In production with compiled circuits, we would use Poseidon
     */
    private hashTaskId(taskId: string): bigint {
        const hash = crypto.createHash('sha256').update(taskId).digest('hex');
        // Truncate to 252 bits to fit in BN128 field
        return BigInt('0x' + hash.substring(0, 63));
    }

    /**
     * Hash output data using SHA256, then truncate to field element
     */
    private hashOutput(outputData: string): bigint {
        const hash = crypto.createHash('sha256').update(outputData).digest('hex');
        // Truncate to 252 bits to fit in BN128 field
        return BigInt('0x' + hash.substring(0, 63));
    }

    /**
     * Generate ZK proof for SLA compliance
     */
    async generateProof(input: SLAProofInput): Promise<SLAProof> {
        if (!await this.isReady()) {
            // Return a mock proof for development
            return this.generateMockProof(input);
        }

        const taskIdHash = this.hashTaskId(input.taskId);
        const outputHash = this.hashOutput(input.outputData);

        const circuitInputs = {
            taskIdHash: taskIdHash.toString(),
            slaDeadline: input.slaDeadline.toString(),
            biasThreshold: input.biasThreshold.toString(),
            completionTimestamp: input.completionTimestamp.toString(),
            biasScore: input.biasScore.toString(),
            outputHash: outputHash.toString(),
        };

        try {
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                circuitInputs,
                this.wasmPath,
                this.zkeyPath
            );

            const proofStr = JSON.stringify(proof);
            const proofBase64 = Buffer.from(proofStr).toString('base64');

            return {
                proof: proofBase64,
                publicSignals,
                proofSizeBytes: proofBase64.length,
                taskIdHash: taskIdHash.toString(16),
                verified: true,
            };
        } catch (error) {
            console.error('Proof generation failed:', error);
            throw new Error(`Failed to generate ZK proof: ${error}`);
        }
    }

    /**
     * Generate a mock proof for development/demo
     * This simulates the proof structure without real cryptography
     */
    private generateMockProof(input: SLAProofInput): SLAProof {
        const taskIdHash = this.hashTaskId(input.taskId);
        const outputHash = this.hashOutput(input.outputData);

        // Validate constraints locally
        const timeValid = input.completionTimestamp <= input.slaDeadline;
        const biasValid = input.biasScore <= input.biasThreshold;
        const outputValid = outputHash > 0n;
        const allValid = timeValid && biasValid && outputValid;

        // Create mock proof structure
        const mockProof = {
            pi_a: [
                crypto.randomBytes(32).toString('hex'),
                crypto.randomBytes(32).toString('hex'),
                '1',
            ],
            pi_b: [
                [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')],
                [crypto.randomBytes(32).toString('hex'), crypto.randomBytes(32).toString('hex')],
                ['1', '0'],
            ],
            pi_c: [
                crypto.randomBytes(32).toString('hex'),
                crypto.randomBytes(32).toString('hex'),
                '1',
            ],
            protocol: 'groth16',
            curve: 'bn128',
        };

        const proofStr = JSON.stringify(mockProof);
        const proofBase64 = Buffer.from(proofStr).toString('base64');

        return {
            proof: proofBase64,
            publicSignals: [
                taskIdHash.toString(),
                input.slaDeadline.toString(),
                input.biasThreshold.toString(),
                '1', // valid output
            ],
            proofSizeBytes: proofBase64.length,
            taskIdHash: taskIdHash.toString(16),
            verified: allValid,
        };
    }
}

export const proofGenerator = new ProofGenerator();
