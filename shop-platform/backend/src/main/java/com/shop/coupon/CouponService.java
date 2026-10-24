package com.shop.coupon;

import com.shop.common.ApiExceptions;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CouponService {

    private final CouponRepository coupons;

    public CouponService(CouponRepository coupons) {
        this.coupons = coupons;
    }

    /** Validates a code against the cart subtotal and returns the coupon if usable. */
    @Transactional(readOnly = true)
    public Coupon validate(String code, int subtotalPaise) {
        Coupon coupon = coupons.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ApiExceptions.BadRequestException("Unknown coupon " + code));

        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new ApiExceptions.BadRequestException("Coupon " + coupon.getCode() + " is no longer active");
        }
        if (subtotalPaise < coupon.getMinOrderPaise()) {
            throw new ApiExceptions.BadRequestException(
                    "Coupon " + coupon.getCode() + " needs a minimum order of "
                            + coupon.getMinOrderPaise() + " paise");
        }
        return coupon;
    }

    @Transactional(readOnly = true)
    public Coupon find(String code) {
        return code == null ? null : coupons.findByCodeIgnoreCase(code).orElse(null);
    }
}
