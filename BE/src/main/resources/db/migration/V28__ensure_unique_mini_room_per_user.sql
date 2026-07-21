LOCK TABLE mini_room, mini_room_item IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE duplicate_mini_room_ids ON COMMIT DROP AS
SELECT id
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY updated_at DESC, id DESC
        ) AS room_rank
    FROM mini_room
) ranked_rooms
WHERE room_rank > 1;

DELETE FROM mini_room_item room_item
USING duplicate_mini_room_ids duplicate_room
WHERE room_item.mini_room_id = duplicate_room.id;

DELETE FROM mini_room room
USING duplicate_mini_room_ids duplicate_room
WHERE room.id = duplicate_room.id;

ALTER TABLE mini_room
ADD CONSTRAINT uk_mini_room_user_id UNIQUE (user_id);
