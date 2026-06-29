import asyncio
import sys
import os
import logging
logging.getLogger('sqlalchemy.engine.Engine').setLevel(logging.WARNING)
sys.path.append('e:/RACE 2/backend')
from app.database import async_session
from app.models.access_log import AccessLog
from sqlalchemy import select
from datetime import datetime, timedelta

async def main():
    with open('out3.txt', 'w', encoding='utf-8') as f:
        since = datetime.utcnow() - timedelta(days=30)
        async with async_session() as session:
            result = await session.execute(
                select(AccessLog).where(AccessLog.timestamp >= since)
            )
            logs = list(result.scalars().all())
            total = len(logs)
            f.write(f'Total logs retrieved: {total}\n')
            if total > 0:
                high = sum(1 for l in logs if l.risk_score > 60)
                mfa = sum(1 for l in logs if l.decision == 'MFA_REQUIRED')
                avg = sum(l.risk_score for l in logs) / total
                f.write(f'High: {high}, MFA: {mfa}, Avg Risk: {avg}\n')

            res2 = await session.execute(select(AccessLog.timestamp).order_by(AccessLog.timestamp.desc()).limit(1))
            latest = res2.scalar()
            f.write(f'Latest timestamp in DB: {latest}\n')
            f.write(f'Since threshold: {since}\n')

asyncio.run(main())
