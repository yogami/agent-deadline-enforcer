import { describe, it, expect } from 'vitest';
import { CheckDeadlines } from '../../src/lib/deadline-enforcer/application/usecases/CheckDeadlines';
import { IDeadlineRepository } from '../../src/lib/deadline-enforcer/domain/ports/IDeadlineRepository';
import { DeadlineTask } from '../../src/lib/deadline-enforcer/domain/entities/DeadlineTask';

describe('Deadline Enforcer Characterization', () => {
    it('should identify and status-update breached deadlines', async () => {
        // 1. Setup Mocks
        const tasks: DeadlineTask[] = [
            { id: '1', agentId: 'a1', status: 'PENDING', deadline: new Date(Date.now() - 10000), createdAt: new Date(), updatedAt: new Date() } as any, // Overdue
            { id: '2', agentId: 'a1', status: 'PENDING', deadline: new Date(Date.now() + 10000), createdAt: new Date(), updatedAt: new Date() } as any  // Future
        ];

        const mockRepo: IDeadlineRepository = {
            saveTask: async (t) => t as any,
            getTaskById: async () => null,
            findOverdueTasks: async (time) => tasks.filter(t => t.status === 'PENDING' && t.deadline <= time),
            updateStatus: async (id, status) => {
                const t = tasks.find(x => x.id === id);
                if (t) t.status = status;
                return t as any;
            }
        };

        const useCase = new CheckDeadlines(mockRepo);

        // 2. Execute
        const breachedTasks = await useCase.execute();

        // 3. Verify Logic
        expect(breachedTasks).toHaveLength(1);
        expect(breachedTasks[0].id).toBe('1');

        expect(tasks[0].status).toBe('BREACHED');
        expect(tasks[1].status).toBe('PENDING'); // Should remain untouched
    });
});
