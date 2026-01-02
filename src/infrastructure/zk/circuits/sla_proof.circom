pragma circom 2.0.0;

include "node_modules/circomlibjs/circuits/poseidon.circom";
include "node_modules/circomlibjs/circuits/comparators.circom";

/*
 * ZK-SLA Proof Circuit
 * 
 * Proves: Task was completed under SLA deadline without revealing:
 *   - Actual completion timestamp
 *   - Internal task state
 *   - Agent logs
 *
 * Public Inputs:
 *   - taskIdHash: Poseidon hash of task ID
 *   - slaDeadline: Maximum allowed completion time (Unix seconds)
 *   - biasThreshold: Maximum allowed bias score (0-100)
 *
 * Private Inputs:
 *   - completionTimestamp: Actual completion time (Unix seconds)
 *   - biasScore: Measured bias score (0-100)
 *   - outputHash: Hash of agent output (for commitment)
 *
 * Output:
 *   - valid: 1 if all constraints pass, 0 otherwise
 */
template SLAProof() {
    // Public inputs
    signal input taskIdHash;
    signal input slaDeadline;
    signal input biasThreshold;

    // Private inputs
    signal input completionTimestamp;
    signal input biasScore;
    signal input outputHash;

    // Output
    signal output valid;

    // Constraint 1: completionTimestamp <= slaDeadline
    // Using LessEqThan comparator (32-bit comparison should handle Unix timestamps until 2106)
    component timeCheck = LessEqThan(32);
    timeCheck.in[0] <== completionTimestamp;
    timeCheck.in[1] <== slaDeadline;

    // Constraint 2: biasScore <= biasThreshold
    component biasCheck = LessEqThan(8); // 8-bit for 0-255 range
    biasCheck.in[0] <== biasScore;
    biasCheck.in[1] <== biasThreshold;

    // Constraint 3: Verify the output commitment exists (non-zero)
    component outputNonZero = IsZero();
    outputNonZero.in <== outputHash;
    signal outputExists;
    outputExists <== 1 - outputNonZero.out;

    // All constraints must pass
    signal timeAndBias;
    timeAndBias <== timeCheck.out * biasCheck.out;
    valid <== timeAndBias * outputExists;

    // Force valid to be 1 (proof fails if any constraint fails)
    valid === 1;
}

component main {public [taskIdHash, slaDeadline, biasThreshold]} = SLAProof();
