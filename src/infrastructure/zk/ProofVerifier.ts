/**
 * ZK-SLA Proof Verifier
 *
 * Verifies Zero-Knowledge proofs for SLA compliance.
 * Works without access to the original private inputs.
 */
import * as snarkjs from 'snarkjs';
import * as path from 'path';
import * as fs from 'fs';
import { SLAProof } from './ProofGenerator';

export interface VerificationResult {
    valid: boolean;
    taskIdHash: string;
    slaDeadline: number;
    biasThreshold: number;
    message: string;
}

export class ProofVerifier {
    private vkeyPath: string;
    private verificationKey: object | null = null;

    constructor() {
        const circuitsDir = path.join(__dirname, 'circuits', 'compiled');
        this.vkeyPath = path.join(circuitsDir, 'verification_key.json');
    }

    /**
     * Load verification key from disk
     */
    private async loadVerificationKey(): Promise<object> {
        if (this.verificationKey) {
            return this.verificationKey;
        }

        try {
            const vkeyJson = await fs.promises.readFile(this.vkeyPath, 'utf-8');
            this.verificationKey = JSON.parse(vkeyJson);
            return this.verificationKey!;
        } catch {
            // Return mock verification key for development
            return this.getMockVerificationKey();
        }
    }

    /**
     * Mock verification key for development
     */
    private getMockVerificationKey(): object {
        return {
            protocol: 'groth16',
            curve: 'bn128',
            nPublic: 4,
            vk_alpha_1: ['0', '0', '0'],
            vk_beta_2: [['0', '0'], ['0', '0'], ['0', '0']],
            vk_gamma_2: [['0', '0'], ['0', '0'], ['0', '0']],
            vk_delta_2: [['0', '0'], ['0', '0'], ['0', '0']],
            vk_alphabeta_12: [],
            IC: [],
        };
    }

    /**
     * Verify a ZK proof
     */
    async verifyProof(slaProof: SLAProof): Promise<VerificationResult> {
        const vkey = await this.loadVerificationKey();

        try {
            // Decode the proof from Base64
            const proofJson = Buffer.from(slaProof.proof, 'base64').toString('utf-8');
            const proof = JSON.parse(proofJson);

            // Check if this is a mock proof (development mode)
            if (!await this.hasCompiledCircuits()) {
                return this.verifyMockProof(slaProof, proof);
            }

            // Verify using snarkjs
            const result = await snarkjs.groth16.verify(
                vkey,
                slaProof.publicSignals,
                proof
            );

            const publicInputs = this.parsePublicSignals(slaProof.publicSignals);

            return {
                valid: result,
                taskIdHash: publicInputs.taskIdHash,
                slaDeadline: publicInputs.slaDeadline,
                biasThreshold: publicInputs.biasThreshold,
                message: result
                    ? 'ZK proof verified: Agent proved SLA compliance without revealing internals'
                    : 'ZK proof verification failed: Constraints not satisfied',
            };
        } catch (error) {
            return {
                valid: false,
                taskIdHash: slaProof.taskIdHash,
                slaDeadline: 0,
                biasThreshold: 0,
                message: `Verification error: ${error}`,
            };
        }
    }

    /**
     * Check if compiled circuits exist
     */
    private async hasCompiledCircuits(): Promise<boolean> {
        try {
            await fs.promises.access(this.vkeyPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Verify mock proof (development mode)
     */
    private verifyMockProof(slaProof: SLAProof, proof: object): VerificationResult {
        // In development mode, trust the verified flag from the generator
        const publicInputs = this.parsePublicSignals(slaProof.publicSignals);

        return {
            valid: slaProof.verified,
            taskIdHash: publicInputs.taskIdHash,
            slaDeadline: publicInputs.slaDeadline,
            biasThreshold: publicInputs.biasThreshold,
            message: slaProof.verified
                ? '[DEV MODE] Mock ZK proof accepted: Constraints satisfied locally'
                : '[DEV MODE] Mock ZK proof rejected: Constraints not satisfied',
        };
    }

    /**
     * Parse public signals from proof
     */
    private parsePublicSignals(signals: string[]): {
        taskIdHash: string;
        slaDeadline: number;
        biasThreshold: number;
    } {
        return {
            taskIdHash: signals[0] || '0',
            slaDeadline: parseInt(signals[1] || '0', 10),
            biasThreshold: parseInt(signals[2] || '0', 10),
        };
    }
}

export const proofVerifier = new ProofVerifier();
