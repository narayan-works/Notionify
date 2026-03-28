import { NextResponse } from 'next/server';
import { getTransferById, updateTransfer, deleteTransfer } from '@/lib/transfers';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const transfer = getTransferById(id);
        if (!transfer) {
            return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
        }
        return NextResponse.json(transfer);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const transfer = updateTransfer(id, body);
        if (!transfer) {
            return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
        }
        return NextResponse.json(transfer);
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = await params;
        const success = deleteTransfer(id);
        if (!success) {
            return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
