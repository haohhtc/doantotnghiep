package com.erpqlkho.backend.category.pricelist.entity;

import com.erpqlkho.backend.common.base.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

// type: hard-code 2 gia tri PURCHASE (Bang gia mua) / SALE (Bang gia ban) - PriceListService.lookupPrice
// chi xet dung loai bang gia tuong ung voi muc dich tra gia (mua/ban) - xem V19__product_tabs_price_list_type.sql.
// Hieu luc (start_date/end_date) nam o tung dong gia (PriceListItem), khong con o bang gia - xem
// V41__price_list_item_validity.sql.
@Getter
@Setter
@Entity
@Table(name = "price_list")
public class PriceList extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 20)
    private String type = "SALE";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
