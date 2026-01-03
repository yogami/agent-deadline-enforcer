import { NextResponse } from 'next/server';
import { RegisterTask } from '@/lib/deadline-enforcer/application/usecases/RegisterTask';
import { PostgresDeadlineRepository } from '@/infrastructure/repositories/PostgresDeadlineRepository';

const repo = new PostgresDeadlineRepository();
const registerUseCase = new RegisterTask(repo);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const task = await registerUseCase.execute({
            agentId: body.agentId,
            description: body.description,
            deadline: new Date(body.deadline),
            slaPolicy: body.slaPolicy || 'STRICT',
        });
        return NextResponse.json(task);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
