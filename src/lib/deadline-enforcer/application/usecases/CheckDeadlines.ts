import { IDeadlineRepository } from '../../domain/ports/IDeadlineRepository';
import { DeadlineTask } from '../../domain/entities/DeadlineTask';

export class CheckDeadlines {
    constructor(private repository: IDeadlineRepository) { }

    async execute(): Promise<DeadlineTask[]> {
        const now = new Date();
        const overdueTasks = await this.repository.findOverdueTasks(now);

        const breachedTasks: DeadlineTask[] = [];
        for (const task of overdueTasks) {
            const updated = await this.repository.updateStatus(task.id, 'BREACHED');
            breachedTasks.push(updated);
        }

        return breachedTasks;
    }
}
