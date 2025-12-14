import { describe, it, expect, vi } from 'vitest';
import { CheckDeadlines } from '../../application/usecases/CheckDeadlines';
import { IDeadlineRepository } from '../../domain/interfaces/IDeadlineRepository';

describe('CheckDeadlines', () => {
    it('should mark overdue tasks as BREACHED', async () => {
        const mockTask = {
            id: '1',
            agentId: 'a1',
            description: 'task',
            deadline: new Date(),
            status: 'PENDING' as const,
            slaPolicy: 'STRICT' as const,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const mockRepo: IDeadlineRepository = {
            saveTask: vi.fn(),
            findOverdueTasks: vi.fn().mockResolvedValue([mockTask]),
            updateStatus: vi.fn().mockResolvedValue({ ...mockTask, status: 'BREACHED' }),
            getTaskById: vi.fn(),
        };

        const useCase = new CheckDeadlines(mockRepo);
        const result = await useCase.execute();

        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('BREACHED');
        expect(mockRepo.updateStatus).toHaveBeenCalledWith('1', 'BREACHED');
    });
});
