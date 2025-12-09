"""API routes for chat messages."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.db.models import ChatMessage, User
from app.models import ChatMessageCreate, ChatMessageResponse, ChatListResponse

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("", response_model=ChatListResponse)
async def list_chat_messages(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> ChatListResponse:
    """List all chat messages with user information."""
    result = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.user))
        .order_by(ChatMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()

    # Get total count
    count_result = await db.execute(select(ChatMessage))
    total = len(count_result.scalars().all())

    # Build response with user info
    message_responses = [
        ChatMessageResponse(
            id=msg.id,
            user_id=msg.user_id,
            message=msg.message,
            created_at=msg.created_at,
            user_first_name=msg.user.first_name,
            user_last_name=msg.user.last_name,
        )
        for msg in messages
    ]

    return ChatListResponse(messages=message_responses, total=total)


@router.post("", response_model=ChatMessageResponse, status_code=201)
async def create_chat_message(
    user_id: str,
    message_data: ChatMessageCreate,
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    """Create a new chat message."""
    # Verify user exists
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create the message
    chat_message = ChatMessage(
        user_id=user_id,
        message=message_data.message,
    )
    db.add(chat_message)
    await db.commit()
    await db.refresh(chat_message)

    # Fetch with user info
    result = await db.execute(
        select(ChatMessage)
        .options(selectinload(ChatMessage.user))
        .where(ChatMessage.id == chat_message.id)
    )
    msg = result.scalar_one()

    return ChatMessageResponse(
        id=msg.id,
        user_id=msg.user_id,
        message=msg.message,
        created_at=msg.created_at,
        user_first_name=msg.user.first_name,
        user_last_name=msg.user.last_name,
    )

