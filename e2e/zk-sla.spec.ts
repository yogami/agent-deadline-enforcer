import { test, expect } from '@playwright/test';

/**
 * E2E Tests for ZK-SLA API
 * 
 * Tests the /api/prove-sla endpoint for Zero-Knowledge SLA verification.
 * Following ATDD: Acceptance tests written first, then implementation.
 */

test.describe('ZK-SLA API E2E', () => {
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

    test.describe('GET /api/prove-sla', () => {
        test('should return API documentation', async ({ request }) => {
            const response = await request.get(`${BASE_URL}/api/prove-sla`);

            expect(response.ok()).toBeTruthy();
            const data = await response.json();

            expect(data.name).toBe('ZK-SLA Proof API');
            expect(data.version).toBe('1.0.0');
            expect(data.cryptography.provingSystem).toContain('Groth16');
        });
    });

    test.describe('POST /api/prove-sla', () => {
        test('should generate valid proof for compliant task', async ({ request }) => {
            const now = new Date();
            const response = await request.post(`${BASE_URL}/api/prove-sla`, {
                data: {
                    taskId: 'e2e_test_task_001',
                    agentId: 'e2e_test_agent',
                    taskDescription: 'E2E test task for ZK-SLA',
                    completedAt: now.toISOString(),
                    slaDeadlineSeconds: 60,
                    outputData: 'Test output data for E2E verification',
                    biasScore: 0,
                    biasThreshold: 5,
                },
            });

            expect(response.ok()).toBeTruthy();
            const data = await response.json();

            // Verify proof structure
            expect(data.proofId).toBeTruthy();
            expect(data.proof).toBeTruthy();
            expect(data.publicSignals).toBeInstanceOf(Array);
            expect(data.publicSignals.length).toBeGreaterThan(0);
            expect(data.proofSizeBytes).toBeGreaterThan(0);
            expect(data.verified).toBe(true);
            expect(data.message).toMatch(/proof|Constraints satisfied/i);
        });

        test('should reject task that breaches SLA deadline', async ({ request }) => {
            // Create a task that completed AFTER its deadline
            const pastDeadline = new Date(Date.now() + 1000000); // Far future completion

            const response = await request.post(`${BASE_URL}/api/prove-sla`, {
                data: {
                    taskId: 'e2e_test_task_breach',
                    agentId: 'e2e_test_agent',
                    completedAt: pastDeadline.toISOString(),
                    slaDeadlineSeconds: -100, // Negative = already breached
                    outputData: 'Late task output',
                },
            });

            expect(response.ok()).toBeTruthy();
            const data = await response.json();

            // Proof should be generated but verified=false
            expect(data.proof).toBeTruthy();
            expect(data.verified).toBe(false);
        });

        test('should reject task with bias exceeding threshold', async ({ request }) => {
            const now = new Date();
            const response = await request.post(`${BASE_URL}/api/prove-sla`, {
                data: {
                    taskId: 'e2e_test_task_biased',
                    agentId: 'e2e_test_agent',
                    completedAt: now.toISOString(),
                    slaDeadlineSeconds: 60,
                    outputData: 'Biased output',
                    biasScore: 50, // Way over threshold
                    biasThreshold: 5,
                },
            });

            expect(response.ok()).toBeTruthy();
            const data = await response.json();

            expect(data.verified).toBe(false);
        });

        test('should return 400 for missing required fields', async ({ request }) => {
            const response = await request.post(`${BASE_URL}/api/prove-sla`, {
                data: {
                    // Missing taskId, agentId, etc.
                    outputData: 'Some output',
                },
            });

            expect(response.status()).toBe(400);
            const data = await response.json();
            expect(data.error).toContain('Missing required field');
        });

        test('should generate consistent hashes for same taskId', async ({ request }) => {
            const now = new Date();
            const taskData = {
                taskId: 'e2e_consistent_hash_test',
                agentId: 'e2e_test_agent',
                completedAt: now.toISOString(),
                slaDeadlineSeconds: 60,
                outputData: 'Output 1',
            };

            const response1 = await request.post(`${BASE_URL}/api/prove-sla`, {
                data: taskData,
            });
            const response2 = await request.post(`${BASE_URL}/api/prove-sla`, {
                data: { ...taskData, outputData: 'Different output' },
            });

            const data1 = await response1.json();
            const data2 = await response2.json();

            // Same taskId should produce same taskIdHash
            expect(data1.publicSignals[0]).toBe(data2.publicSignals[0]);
        });
    });

    test.describe('Cross-Agent Handshake Simulation', () => {
        test('Agent A generates proof, Agent B can verify structure', async ({ request }) => {
            // Agent A generates a proof
            const agentAResponse = await request.post(`${BASE_URL}/api/prove-sla`, {
                data: {
                    taskId: 'cross_agent_task_001',
                    agentId: 'agent_gemini_001',
                    taskDescription: 'Summarize document for Agent B',
                    completedAt: new Date().toISOString(),
                    slaDeadlineSeconds: 30,
                    outputData: 'Summary: The document discusses AI safety protocols.',
                },
            });

            const agentAData = await agentAResponse.json();
            expect(agentAData.verified).toBe(true);

            // Agent B receives the proof and verifies structure
            // (In production, Agent B would call a verify endpoint)
            expect(agentAData.proof).toBeTruthy();
            expect(agentAData.publicSignals).toBeInstanceOf(Array);
            expect(agentAData.proofSizeBytes).toBeLessThan(2000); // Reasonable size

            // The proof should be verifiable by its structure
            const decodedProof = JSON.parse(
                Buffer.from(agentAData.proof, 'base64').toString('utf-8')
            );
            expect(decodedProof.protocol).toBe('groth16');
            expect(decodedProof.curve).toBe('bn128');
            expect(decodedProof.pi_a).toBeInstanceOf(Array);
            expect(decodedProof.pi_b).toBeInstanceOf(Array);
            expect(decodedProof.pi_c).toBeInstanceOf(Array);
        });
    });
});
