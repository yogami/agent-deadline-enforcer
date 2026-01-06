/**
 * OpenAPI JSON Endpoint for Agent Deadline Enforcer
 * GET /api/openapi.json
 */

import { NextResponse } from 'next/server';

export async function GET() {
    const spec = {
        openapi: '3.0.3',
        info: {
            title: 'Agent Deadline Enforcer API',
            version: '1.0.0',
            description: 'SLA monitoring, breach detection, and ZK-timestamped completion proofs for agent tasks.'
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Local development' }
        ],
        paths: {
            '/api/tasks': {
                post: {
                    summary: 'Register a task with deadline',
                    operationId: 'registerTask',
                    tags: ['Tasks'],
                    responses: { '200': { description: 'Task registered' } }
                },
                get: {
                    summary: 'List active tasks',
                    operationId: 'listTasks',
                    tags: ['Tasks'],
                    responses: { '200': { description: 'List of tasks' } }
                }
            },
            '/api/prove-sla': {
                post: {
                    summary: 'Generate ZK-proof of SLA compliance',
                    operationId: 'proveSLA',
                    tags: ['Proofs'],
                    responses: { '200': { description: 'ZK-SLA proof' } }
                }
            }
        }
    };

    return NextResponse.json(spec, {
        headers: { 'Content-Type': 'application/json' }
    });
}
