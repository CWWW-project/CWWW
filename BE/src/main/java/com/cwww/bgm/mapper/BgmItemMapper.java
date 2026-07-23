package com.cwww.bgm.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

// BGM 아이템을 item 테이블에 등록
@Mapper
public interface BgmItemMapper {

    // 같은 이름("제목 - 아티스트")의 BGM 아이템이 이미 등록되어 있는지 확인 (중복 방지)
    int countBgmItemByName(@Param("name") String name);

    /*
     * BGM 아이템을 item 테이블에 등록 (category='BGM')
     * useGeneratedKeys로 생성된 item_id를 파라미터 객체(BgmItemInsertParam)의 itemId 필드에 채워줌
     * 이미 같은 이름으로 등록돼있으면 ON CONFLICT DO NOTHING으로 조용히 무시됨 (영향받은 row 수 0 반환)
     */
    int insertBgmItem(BgmItemInsertParam param);

    //  INSERT에 필요한 값들만 담는 임시 그릇
    class BgmItemInsertParam {

        private Long itemId;  // INSERT 하고 나서 채워질 자리 (비워둠, 알아서 DB가 채워줌)
        private final String name; // "제목 - 아티스트"
        private final String description; // "재생시간 4:32 · rock"
        private final int price; // BGM 가격

        public BgmItemInsertParam(String name, String description, int price) {

            this.name = name;
            this.description = description;
            this.price = price;

        }

        public Long getItemId() { return itemId; }
        // MyBatis가 INSERT 끝나고 자동으로 호출
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public int getPrice() { return price; }

    }

}
