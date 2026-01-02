import { describe, it, expect, beforeEach } from 'vitest';
import { ProofGenerator, SLAProofInput } from '../ProofGenerator';
import { ProofVerifier } from '../ProofVerifier';

describe('ZK-SLA ProofGenerator', () => {
    let generator: ProofGenerator;

    beforeEach(() => {
        generator = new ProofGenerator();
    });

    describe('generateProof', () => {
        it('should generate a valid proof when task completes under SLA', async () => {
            const input: SLAProofInput = {
                taskId: 'task_test_001',
                completionTimestamp: 1704200000, // Jan 2, 2024
                slaDeadline: 1704200030, // 30 seconds later
                biasScore: 2,
                biasThreshold: 5,
                outputData: 'Task completed successfully',
            };

            const proof = await generator.generateProof(input);

            expect(proof).toBeDefined();
            expect(proof.proof).toBeTruthy();
            expect(proof.publicSignals).toBeInstanceOf(Array);
            expect(proof.proofSizeBytes).toBeGreaterThan(0);
            expect(proof.verified).toBe(true);
        });

        it('should generate an invalid proof when task breaches SLA deadline', async () => {
            const input: SLAProofInput = {
                taskId: 'task_test_002',
                completionTimestamp: 1704200100, // After deadline
                slaDeadline: 1704200030, // Earlier deadline
                biasScore: 2,
                biasThreshold: 5,
                outputData: 'Task completed late',
            };

            const proof = await generator.generateProof(input);

            expect(proof).toBeDefined();
            expect(proof.verified).toBe(false);
        });

        it('should generate an invalid proof when bias exceeds threshold', async () => {
            const input: SLAProofInput = {
                taskId: 'task_test_003',
                completionTimestamp: 1704200000,
                slaDeadline: 1704200030,
                biasScore: 10, // Exceeds threshold of 5
                biasThreshold: 5,
                outputData: 'Biased output',
            };

            const proof = await generator.generateProof(input);

            expect(proof).toBeDefined();
            expect(proof.verified).toBe(false);
        });

        it('should hash task ID consistently', async () => {
            const input1: SLAProofInput = {
                taskId: 'same_task_id',
                completionTimestamp: 1704200000,
                slaDeadline: 1704200030,
                biasScore: 0,
                biasThreshold: 5,
                outputData: 'Output 1',
            };

            const input2: SLAProofInput = {
                ...input1,
                outputData: 'Output 2 different',
            };

            const proof1 = await generator.generateProof(input1);
            const proof2 = await generator.generateProof(input2);

            // Same taskId should produce same hash
            expect(proof1.taskIdHash).toBe(proof2.taskIdHash);
        });
    });
});

describe('ZK-SLA ProofVerifier', () => {
    let generator: ProofGenerator;
    let verifier: ProofVerifier;

    beforeEach(() => {
        generator = new ProofGenerator();
        verifier = new ProofVerifier();
    });

    describe('verifyProof', () => {
        it('should verify a valid proof', async () => {
            const input: SLAProofInput = {
                taskId: 'task_verify_001',
                completionTimestamp: 1704200000,
                slaDeadline: 1704200030,
                biasScore: 1,
                biasThreshold: 5,
                outputData: 'Verified output',
            };

            const proof = await generator.generateProof(input);
            const result = await verifier.verifyProof(proof);

            expect(result.valid).toBe(true);
            expect(result.message).toContain('proof');
        });

        it('should reject an invalid proof', async () => {
            const input: SLAProofInput = {
                taskId: 'task_verify_002',
                completionTimestamp: 1704200100, // Breached
                slaDeadline: 1704200030,
                biasScore: 1,
                biasThreshold: 5,
                outputData: 'Late output',
            };

            const proof = await generator.generateProof(input);
            const result = await verifier.verifyProof(proof);

            expect(result.valid).toBe(false);
        });

        it('should parse public signals correctly', async () => {
            const input: SLAProofInput = {
                taskId: 'task_verify_003',
                completionTimestamp: 1704200000,
                slaDeadline: 1704200030,
                biasScore: 3,
                biasThreshold: 10,
                outputData: 'Test output',
            };

            const proof = await generator.generateProof(input);
            const result = await verifier.verifyProof(proof);

            expect(result.taskIdHash).toBeTruthy();
            expect(result.slaDeadline).toBeGreaterThan(0);
            expect(result.biasThreshold).toBeGreaterThan(0);
        });
    });
});

describe('ZK-SLA Integration', () => {
    it('should complete full proof generation and verification cycle', async () => {
        const generator = new ProofGenerator();
        const verifier = new ProofVerifier();

        // Simulate Agent A completing a task
        const agentATask: SLAProofInput = {
            taskId: 'agent_a_task_001',
            completionTimestamp: Math.floor(Date.now() / 1000),
            slaDeadline: Math.floor(Date.now() / 1000) + 60, // 60s deadline
            biasScore: 0,
            biasThreshold: 5,
            outputData: 'Agent A summarized the document without bias',
        };

        // Generate proof
        const proof = await generator.generateProof(agentATask);

        // Agent B verifies the proof without seeing Agent A's internals
        const verification = await verifier.verifyProof(proof);

        expect(verification.valid).toBe(true);
        expect(verification.message).toMatch(/SLA compliance|Constraints satisfied/);
    });
});
