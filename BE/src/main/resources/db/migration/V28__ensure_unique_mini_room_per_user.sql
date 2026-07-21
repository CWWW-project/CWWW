WITH ranked_rooms AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY updated_at DESC, id DESC
        ) AS room_rank
    FROM mini_room
)
DELETE FROM mini_room_item
WHERE mini_room_id IN (
    SELECT id
    FROM ranked_rooms
    WHERE room_rank > 1
);

WITH ranked_rooms AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY updated_at DESC, id DESC
        ) AS room_rank
    FROM mini_room
)
DELETE FROM mini_room
WHERE id IN (
    SELECT id
    FROM ranked_rooms
    WHERE room_rank > 1
);

ALTER TABLE mini_room
ADD CONSTRAINT uk_mini_room_user_id UNIQUE (user_id);
