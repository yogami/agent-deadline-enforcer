export interface DeadlineTask {
    id: string;
    agentId: string;
    description: string;
    deadline: Date;
    status: 'PENDING' | 'COMPLETED' | 'BREACHED';
    slaPolicy: 'STRICT' | 'FLEXIBLE';
    createdAt: Date;
    updatedAt: Date;
}

export type CreateTaskInput = Omit<DeadlineTask, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
