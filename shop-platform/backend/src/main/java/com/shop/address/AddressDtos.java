package com.shop.address;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class AddressDtos {

    public record SaveAddressRequest(
            @NotBlank String label,
            @NotBlank String recipient,
            @NotBlank String line1,
            @NotBlank String city,
            @NotBlank String state,
            @NotBlank String postalCode) {
    }

    public record AddressResponse(
            Long id,
            String label,
            String recipient,
            String line1,
            String city,
            String state,
            String postalCode,
            String formatted,
            Boolean isDefault) {

        public static AddressResponse from(Address a) {
            return new AddressResponse(
                    a.getId(), a.getLabel(), a.getRecipient(), a.getLine1(),
                    a.getCity(), a.getState(), a.getPostalCode(),
                    a.formatted(), a.getIsDefault());
        }
    }

    public record AddressListResponse(List<AddressResponse> addresses, Integer count) {

        public static AddressListResponse from(List<Address> addresses) {
            List<AddressResponse> mapped = addresses.stream().map(AddressResponse::from).toList();
            return new AddressListResponse(mapped, mapped.size());
        }
    }
}
