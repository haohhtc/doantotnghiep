package com.erpqlkho.backend.category.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductDto {

    private Long id;

    @NotBlank(message = "Ma san pham khong duoc de trong")
    private String code;

    @NotBlank(message = "Ten san pham khong duoc de trong")
    private String name;

    private String foreignName;

    @NotNull(message = "Danh muc khong duoc de trong")
    private Long categoryId;

    private String description;

    // null khi tao moi = mac dinh active=true (xu ly trong service)
    private Boolean active;

    // Dung chung 1 nhom quy doi cho ca 3 tab - xem V13__product_mdm.sql.
    private Long uomGroupId;

    // 3 tab Purchase/Sale/Inventory - xem V19__product_tabs_price_list_type.sql.
    private Long purchaseUomId;
    private Long purchaseTaxGroupId;
    private Long saleUomId;
    private Long saleTaxGroupId;
    private Long inventoryUomId;
    private Long inventoryTaxGroupId;
}
