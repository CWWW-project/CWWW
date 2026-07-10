-- V1: 초기 테이블 생성 (CWWW - 싸이월드와이드웹)

-- users
CREATE TABLE users (
    user_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email       VARCHAR(50) UNIQUE,
    password    VARCHAR(200),
    nickname    VARCHAR(50) UNIQUE,
    role        VARCHAR(20),
    provider    VARCHAR(20),
    provider_id VARCHAR(100),
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    deleted_at  TIMESTAMP,
    refresh_token            VARCHAR(255),
    refresh_token_expires_at TIMESTAMP,
    reset_token              VARCHAR(255),
    reset_token_expires_at   TIMESTAMP,
    acorn_balance INT NOT NULL DEFAULT 0
);

-- minihompy
CREATE TABLE minihompy (
    minihompy_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT,
    title         VARCHAR(100),
    introduction  VARCHAR(512),
    mood          VARCHAR(50),
    media_id      BIGINT,
    created_at    TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- friend (일촌)
CREATE TABLE friend (
    friend_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requester_id     BIGINT NOT NULL,
    receiver_id      BIGINT NOT NULL,
    status           VARCHAR(20),
    requester_alias  VARCHAR(30),
    receiver_alias   VARCHAR(30),
    created_at       TIMESTAMP,
    accepted_at      TIMESTAMP,
    terminated_at    TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(user_id),
    FOREIGN KEY (receiver_id)  REFERENCES users(user_id)
);

-- media (polymorphic: target_type = 'POST' | 'ITEM' | 'AVATAR' 등)
CREATE TABLE media (
    media_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    target_type VARCHAR(20),
    target_id   BIGINT,
    media_url   VARCHAR(512),
    created_at  TIMESTAMP
);

-- post (다이어리)
CREATE TABLE post (
    post_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    minihompy_id  BIGINT,
    title         VARCHAR(100),
    content       TEXT,
    visibility    VARCHAR(20) NOT NULL DEFAULT 'ALL',
    view_count    INT NOT NULL DEFAULT 0,
    like_count    INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP,
    deleted_at    TIMESTAMP,
    FOREIGN KEY (user_id)      REFERENCES users(user_id),
    FOREIGN KEY (minihompy_id) REFERENCES minihompy(minihompy_id)
);

-- post_like
CREATE TABLE post_like (
    post_id    BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    created_at TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES post(post_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- post_comment
CREATE TABLE post_comment (
    comment_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id           BIGINT,
    user_id           BIGINT,
    parent_comment_id BIGINT,
    content           VARCHAR(500),
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP,
    FOREIGN KEY (post_id)           REFERENCES post(post_id),
    FOREIGN KEY (user_id)           REFERENCES users(user_id),
    FOREIGN KEY (parent_comment_id) REFERENCES post_comment(comment_id)
);

-- hashtag (POST-09)
CREATE TABLE hashtag (
    hashtag_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE
);

-- post_hashtag
CREATE TABLE post_hashtag (
    post_id    BIGINT NOT NULL,
    hashtag_id BIGINT NOT NULL,
    PRIMARY KEY (post_id, hashtag_id),
    FOREIGN KEY (post_id)    REFERENCES post(post_id),
    FOREIGN KEY (hashtag_id) REFERENCES hashtag(hashtag_id)
);

-- guestbook (방명록)
CREATE TABLE guestbook (
    guestbook_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    minihompy_id BIGINT,
    writer_id    BIGINT,
    content      TEXT,
    is_secret    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP,
    updated_at   TIMESTAMP,
    deleted_at   TIMESTAMP,
    FOREIGN KEY (minihompy_id) REFERENCES minihompy(minihompy_id),
    FOREIGN KEY (writer_id)    REFERENCES users(user_id)
);

-- visit_log (방문자)
CREATE TABLE visit_log (
    visit_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    visitor_id   BIGINT,
    minihompy_id BIGINT,
    visited_at   TIMESTAMP,
    FOREIGN KEY (visitor_id)   REFERENCES users(user_id),
    FOREIGN KEY (minihompy_id) REFERENCES minihompy(minihompy_id)
);

-- chat_room
CREATE TABLE chat_room (
    chat_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type            VARCHAR(10),
    name            VARCHAR(20),
    created_at      TIMESTAMP,
    updated_at      TIMESTAMP,
    last_message_id BIGINT
);

-- chat_participant
CREATE TABLE chat_participant (
    participant_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chat_id               BIGINT,
    user_id               BIGINT,
    left_at               TIMESTAMP,
    last_read_message_id  BIGINT,
    is_alarm              BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (chat_id)  REFERENCES chat_room(chat_id),
    FOREIGN KEY (user_id)  REFERENCES users(user_id)
);

-- chat_message
CREATE TABLE chat_message (
    message_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chat_id      BIGINT,
    sender_id    BIGINT,
    message_type VARCHAR(20),
    content      TEXT,
    is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP,
    FOREIGN KEY (chat_id)   REFERENCES chat_room(chat_id),
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
);

-- item (상점 아이템)
CREATE TABLE item (
    item_id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category      VARCHAR(20),
    name          VARCHAR(100),
    description   TEXT,
    price         INT,
    status        VARCHAR(20),
    reject_reason VARCHAR(255),
    sales_count   INT NOT NULL DEFAULT 0,
    creator_id    BIGINT,
    created_at    TIMESTAMP,
    updated_at    TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(user_id)
);

-- cart (장바구니)
CREATE TABLE cart (
    cart_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT,
    item_id    BIGINT,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (item_id) REFERENCES item(item_id)
);

-- payment (결제)
CREATE TABLE payment (
    payment_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT,
    pg_tx_id    VARCHAR(100),
    method      VARCHAR(20),
    amount      INT,
    status      VARCHAR(20),
    paid_at     TIMESTAMP,
    fail_reason VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- item_purchase (구매 내역)
CREATE TABLE item_purchase (
    purchase_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT,
    item_id     BIGINT,
    payment_id  BIGINT,
    acorn_price INT,
    status      VARCHAR(20),
    created_at  TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(user_id),
    FOREIGN KEY (item_id)    REFERENCES item(item_id),
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
);

-- refund (환불)
CREATE TABLE refund (
    refund_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id   BIGINT,
    reason       VARCHAR(255),
    amount       INT,
    status       VARCHAR(20),
    requested_at TIMESTAMP,
    processed_at TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
);

-- settlement (정산)
CREATE TABLE settlement (
    settlement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    creator_id    BIGINT,
    total_sales   INT,
    fee           INT,
    payout_amount INT,
    status        VARCHAR(20),
    created_at    TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(user_id)
);

-- user_inventory (보유 아이템)
CREATE TABLE user_inventory (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    item_id     BIGINT NOT NULL,
    acquired_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (item_id) REFERENCES item(item_id)
);

-- mini_room
CREATE TABLE mini_room (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id                BIGINT NOT NULL,
    background_inventory_id BIGINT,
    max_item_count         INT NOT NULL DEFAULT 50,
    layout_version         INT NOT NULL DEFAULT 0,
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- avatar
CREATE TABLE avatar (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL,
    avatar_inventory_id BIGINT,
    pos_x               INT,
    pos_y               INT,
    scale               DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    flipped             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- mini_room_item
CREATE TABLE mini_room_item (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mini_room_id      BIGINT NOT NULL,
    user_inventory_id BIGINT NOT NULL,
    pos_x             INT NOT NULL,
    pos_y             INT NOT NULL,
    rotation          INT NOT NULL DEFAULT 0,
    flipped           BOOLEAN NOT NULL DEFAULT FALSE,
    scale             DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    sort_order        INT NOT NULL DEFAULT 0,
    locked            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (mini_room_id)      REFERENCES mini_room(id),
    FOREIGN KEY (user_inventory_id) REFERENCES user_inventory(id)
);
