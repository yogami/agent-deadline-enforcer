import { IDeadlineRepository } from '../../domain/interfaces/IDeadlineRepository';
import { CreateTaskInput, DeadlineTask } from '../../domain/entities/DeadlineTask';

export class RegisterTask {
    constructor(private repository: IDeadlineRepository) { }

    async execute(input: CreateTaskInput): Promise<DeadlineTask> {
        if (new Date(input.deadline) <= new Date()) {
            throw new Error('Deadline must be in the future');
        }
        return this.repository.saveTask(input);
    }
}
