import prisma from '@/infrastructure/db';
import { IDeadlineRepository } from '../../domain/interfaces/IDeadlineRepository';
import { CreateTaskInput, DeadlineTask } from '../../domain/entities/DeadlineTask';

export class PostgresDeadlineRepository implements IDeadlineRepository {
    async saveTask(input: CreateTaskInput): Promise<DeadlineTask> {
        const task = await prisma.task.create({
            data: {
                agentId: input.agentId,
                description: input.description,
                deadline: input.deadline,
                slaPolicy: input.slaPolicy,
                status: 'PENDING'
            }
        });
        return this.mapToEntity(task);
    }

    async findOverdueTasks(currentTime: Date): Promise<DeadlineTask[]> {
        const tasks = await prisma.task.findMany({
            where: {
                status: 'PENDING',
                deadline: { lt: currentTime }
            }
        });
        return tasks.map(this.mapToEntity);
    }

    async updateStatus(id: string, status: DeadlineTask['status']): Promise<DeadlineTask> {
        const task = await prisma.task.update({
            where: { id },
            data: { status }
        });
        return this.mapToEntity(task);
    }

    async getTaskById(id: string): Promise<DeadlineTask | null> {
        const task = await prisma.task.findUnique({ where: { id } });
        return task ? this.mapToEntity(task) : null;
    }

    private mapToEntity(dbTask: any): DeadlineTask {
        return {
            id: dbTask.id,
            agentId: dbTask.agentId,
            description: dbTask.description,
            deadline: dbTask.deadline,
            status: dbTask.status as any,
            slaPolicy: dbTask.slaPolicy as any,
            createdAt: dbTask.createdAt,
            updatedAt: dbTask.updatedAt
        };
    }
}
