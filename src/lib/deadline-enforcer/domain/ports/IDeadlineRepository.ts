import { DeadlineTask, CreateTaskInput } from '../entities/DeadlineTask';

export interface IDeadlineRepository {
    saveTask(task: CreateTaskInput): Promise<DeadlineTask>;
    findOverdueTasks(currentTime: Date): Promise<DeadlineTask[]>;
    updateStatus(id: string, status: DeadlineTask['status']): Promise<DeadlineTask>;
    getTaskById(id: string): Promise<DeadlineTask | null>;
}
