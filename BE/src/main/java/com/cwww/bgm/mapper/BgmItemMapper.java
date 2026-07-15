package com.cwww.bgm.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;

/*
 * BGM 아이템을 item 테이블에 등록 (category='BGM')
 * useGeneratedKeys로 생성된 item_id를 파라미터 객체(BgmItemInsertParam)의 itemId 필드에 채워줌
 */
@Mapper
public interface BgmItemMapper {

    // 같은 이름("제목 - 아티스트")의 BGM 아이템이 이미 등록되어 있는지 확인 (중복 방지)
    int countBgmItemByName(@Param("name") String name);

    /*
     * BGM 아이템을 item 테이블에 등록 (category='BGM')
     * useGeneratedKeys로 생성된 item_id를 파라미터 객체(BgmItemInsertParam)의 itemId 필드에 채워줌
     */
    int insertBgmItem(BgmItemInsertParam param);

    class BgmItemInsertParam {

        private Long itemId; // insert 후 자동 채워짐 (useGeneratedKeys)
        private final String name;
        private final String description;
        private final int price;

        public BgmItemInsertParam(String name, String description, int price) {

            this.name = name;
            this.description = description;
            this.price = price;

        }

        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public int getPrice() { return price; }

    }

}
