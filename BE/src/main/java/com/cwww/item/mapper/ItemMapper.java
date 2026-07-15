package com.cwww.item.mapper;

import com.cwww.item.domain.Item;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ItemMapper {


    //테스트 
    List<Item> findAll();
    List<Item> find(@Param("size") int size, @Param("offset") long offset);
    int countAll();

}
