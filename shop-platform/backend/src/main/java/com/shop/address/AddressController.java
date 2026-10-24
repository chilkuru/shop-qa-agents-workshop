package com.shop.address;

import com.shop.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/addresses")
@Tag(name = "Addresses", description = "Saved delivery addresses")
public class AddressController {

    private final AddressService addressService;
    private final AuthService authService;

    public AddressController(AddressService addressService, AuthService authService) {
        this.addressService = addressService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "List the current user's saved addresses")
    public AddressDtos.AddressListResponse list() {
        return AddressDtos.AddressListResponse.from(addressService.list(authService.currentUser()));
    }

    @PostMapping
    @Operation(summary = "Save a new address")
    public AddressDtos.AddressListResponse add(@Valid @RequestBody AddressDtos.SaveAddressRequest request) {
        addressService.add(authService.currentUser(), request);
        return list();
    }

    @PostMapping("/{addressId}/default")
    @Operation(summary = "Make an address the default")
    public AddressDtos.AddressListResponse makeDefault(@PathVariable Long addressId) {
        addressService.makeDefault(authService.currentUser(), addressId);
        return list();
    }

    @DeleteMapping("/{addressId}")
    @Operation(summary = "Delete a saved address")
    public AddressDtos.AddressListResponse remove(@PathVariable Long addressId) {
        addressService.remove(authService.currentUser(), addressId);
        return list();
    }
}
