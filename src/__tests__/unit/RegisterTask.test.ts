import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterTask } from '../../lib/deadline-enforcer/application/usecases/RegisterTask';
import { IDeadlineRepository } from '../../lib/deadline-enforcer/domain/ports/IDeadlineRepository';

describe('RegisterTask', () => {
    let registerTask: RegisterTask;
    let mockRepo: IDeadlineRepository;

    beforeEach(() => {
        mockRepo = {
            saveTask: vi.fn(),
            findOverdueTasks: vi.fn(),
            updateStatus: vi.fn(),
            getTaskById: vi.fn(),
        };
        registerTask = new RegisterTask(mockRepo);
    });

    it('should register a task with future deadline', async () => {
        const futureDate = new Date(Date.now() + 10000);
        const input = {
            agentId: 'a1',
            description: 'task',
            deadline: futureDate,
            slaPolicy: 'STRICT' as const // Add 'as const' to fix type mismatch
        };

        vi.mocked(mockRepo.saveTask).mockResolvedValue({
            id: '1',
            ...input,
            status: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const result = await registerTask.execute(input);
        expect(result.id).toBe('1');
        expect(mockRepo.saveTask).toHaveBeenCalledWith(input);
    });

    it('should throw if deadline is in past', async () => {
        const pastDate = new Date(Date.now() - 10000);
        await expect(registerTask.execute({
            agentId: 'a1',
            description: 'task',
            deadline: pastDate,
            slaPolicy: 'STRICT'
        })).rejects.toThrow('Deadline must be in the future');
    });
});
