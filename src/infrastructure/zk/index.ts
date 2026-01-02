/**
 * ZK-SLA Module Index
 * 
 * Exports all ZK-SLA proof generation and verification services.
 */

export { ProofGenerator, proofGenerator } from './ProofGenerator';
export type { SLAProofInput, SLAProof, PublicInputs } from './ProofGenerator';

export { ProofVerifier, proofVerifier } from './ProofVerifier';
export type { VerificationResult } from './ProofVerifier';
