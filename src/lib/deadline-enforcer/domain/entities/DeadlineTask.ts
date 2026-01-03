export interface DeadlineTask {
    id: string;
    agentId: string;
    description: string;
    deadline: Date;
    status: 'PENDING' | 'COMPLETED' | 'BREACHED';
    slaPolicy: 'STRICT' | 'FLEXIBLE';
    zkProof?: string; // Base64 encoded ZK-SNARK proof
    zkProofVerified?: boolean; // Whether the proof has been verified
    createdAt: Date;
    updatedAt: Date;
}

export type CreateTaskInput = Omit<DeadlineTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
