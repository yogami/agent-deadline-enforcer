import { NextResponse } from 'next/server';
import { CheckDeadlines } from '@/lib/deadline-enforcer/application/usecases/CheckDeadlines';
import { PostgresDeadlineRepository } from '@/infrastructure/repositories/PostgresDeadlineRepository';

const repo = new PostgresDeadlineRepository();
const checkUseCase = new CheckDeadlines(repo);

export async function POST() {
    try {
        const breached = await checkUseCase.execute();
        return NextResponse.json({ breachedTasks: breached });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
