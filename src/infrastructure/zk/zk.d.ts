/**
 * Type declarations for snarkjs and circomlibjs
 */

declare module 'snarkjs' {
    export namespace groth16 {
        function fullProve(
            input: Record<string, string>,
            wasmPath: string,
            zkeyPath: string
        ): Promise<{ proof: object; publicSignals: string[] }>;

        function verify(
            vkey: object,
            publicSignals: string[],
            proof: object
        ): Promise<boolean>;
    }
}

declare module 'circomlibjs' {
    export function poseidon(inputs: bigint[]): bigint;
    export function buildPoseidon(): Promise<{
        (inputs: bigint[]): bigint;
        F: {
            toObject(x: bigint): bigint;
        };
    }>;
}
