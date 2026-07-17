from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta


def get_statistics_date_range(
    group_by: str,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    alpha: int = 7
) -> tuple[datetime, datetime]:
    """
    Trả về khoảng thời gian mặc định cho thống kê.

    date  : n ngày gần nhất
    week  : n tuần gần nhất (bắt đầu từ thứ 2)
    month : n tháng gần nhất (bắt đầu từ ngày 1)
    year  : n năm gần nhất (bắt đầu từ 01/01)
    """

    now = datetime.now()

    if to_date is None:
        to_date = now

    if from_date is not None:
        return from_date, to_date

    if group_by == "date":
        from_date = (now - timedelta(days=alpha)).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

    elif group_by == "week":
        start_of_week = (
            now - timedelta(days=now.weekday())
        ).replace(
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        from_date = start_of_week - timedelta(weeks=alpha)

    elif group_by == "month":
        start_of_month = now.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0,
        )

        from_date = start_of_month - relativedelta(months=alpha)

    elif group_by == "year":
        from_date = datetime(
            year=now.year - alpha,
            month=1,
            day=1,
        )

    else:
        raise ValueError(f"Unsupported group_by: {group_by}")

    return from_date, to_date