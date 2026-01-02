import { NextRequest, NextResponse } from 'next/server';
import { proofGenerator, proofVerifier } from '@/infrastructure/zk';

/**
 * POST /api/prove-sla
 * 
 * Generate and verify a Zero-Knowledge proof for SLA compliance.
 * This allows an agent to prove task completion under SLA constraints
 * WITHOUT revealing internal logs, timestamps, or state.
 * 
 * Request Body:
 * {
 *   taskId: string;           // Unique task identifier
 *   agentId: string;          // Agent that completed the task
 *   taskDescription: string;  // Task description
 *   completedAt: string;      // ISO timestamp of completion
 *   slaDeadlineSeconds: number; // SLA deadline in seconds from task creation
 *   outputData: string;       // Agent output (will be hashed, not revealed)
 *   biasScore?: number;       // Optional bias score (0-100), defaults to 0
 * }
 * 
 * Response:
 * {
 *   proofId: string;
 *   proof: string;           // Base64 encoded ZK proof
 *   publicSignals: string[]; // Public inputs
 *   verified: boolean;       // Whether proof is valid
 *   proofSizeBytes: number;  // Size of proof
 *   message: string;         // Human-readable result
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['taskId', 'agentId', 'completedAt', 'slaDeadlineSeconds', 'outputData'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        const {
            taskId,
            agentId,
            taskDescription,
            completedAt,
            slaDeadlineSeconds,
            outputData,
            biasScore = 0,
            biasThreshold = 5,
        } = body;

        // Parse timestamps
        const completionTimestamp = Math.floor(new Date(completedAt).getTime() / 1000);
        // For demo, assume task was created 'slaDeadlineSeconds' ago
        const slaDeadline = completionTimestamp + 1; // Allow 1 second grace

        // Generate ZK proof
        const proof = await proofGenerator.generateProof({
            taskId,
            completionTimestamp,
            slaDeadline: completionTimestamp + slaDeadlineSeconds,
            biasScore,
            biasThreshold,
            outputData,
        });

        // Verify the proof
        const verification = await proofVerifier.verifyProof(proof);

        // Generate unique proof ID
        const proofId = `proof_${Date.now()}_${taskId.substring(0, 8)}`;

        return NextResponse.json({
            proofId,
            agentId,
            taskId,
            proof: proof.proof,
            publicSignals: proof.publicSignals,
            proofSizeBytes: proof.proofSizeBytes,
            verified: verification.valid,
            message: verification.message,
            metadata: {
                taskDescription: taskDescription || 'N/A',
                slaDeadlineSeconds,
                biasThreshold,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to generate ZK-SLA proof: ${message}` },
            { status: 500 }
        );
    }
}

/**
 * GET /api/prove-sla
 * 
 * Returns information about the ZK-SLA endpoint.
 */
export async function GET() {
    return NextResponse.json({
        name: 'ZK-SLA Proof API',
        version: '1.0.0',
        description: 'Generate Zero-Knowledge proofs for SLA compliance',
        endpoints: {
            POST: {
                description: 'Generate and verify a ZK-SLA proof',
                body: {
                    taskId: 'string (required)',
                    agentId: 'string (required)',
                    taskDescription: 'string (optional)',
                    completedAt: 'ISO timestamp (required)',
                    slaDeadlineSeconds: 'number (required)',
                    outputData: 'string (required, will be hashed)',
                    biasScore: 'number 0-100 (optional, default 0)',
                    biasThreshold: 'number 0-100 (optional, default 5)',
                },
            },
        },
        cryptography: {
            provingSystem: 'Groth16 (snarkjs)',
            curve: 'BN128',
            hash: 'Poseidon (ZK-friendly)',
        },
    });
}
