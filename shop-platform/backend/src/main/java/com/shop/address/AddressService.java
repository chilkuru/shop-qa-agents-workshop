package com.shop.address;

import com.shop.common.ApiExceptions;
import com.shop.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressService {

    private final AddressRepository addresses;

    public AddressService(AddressRepository addresses) {
        this.addresses = addresses;
    }

    @Transactional(readOnly = true)
    public List<Address> list(User user) {
        return addresses.findByUserIdOrderByCreatedAtAsc(user.getId());
    }

    @Transactional
    public Address add(User user, AddressDtos.SaveAddressRequest request) {
        boolean first = addresses.findByUserIdOrderByCreatedAtAsc(user.getId()).isEmpty();

        Address address = Address.builder()
                .user(user)
                .label(request.label())
                .recipient(request.recipient())
                .line1(request.line1())
                .city(request.city())
                .state(request.state())
                .postalCode(request.postalCode())
                // The first address a shopper saves becomes their default automatically.
                .isDefault(first)
                .build();

        return addresses.save(address);
    }

    @Transactional
    public Address makeDefault(User user, Long addressId) {
        Address target = addresses.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ApiExceptions.NotFoundException("No address " + addressId));

        addresses.findByUserIdOrderByCreatedAtAsc(user.getId()).forEach(a -> {
            a.setIsDefault(a.getId().equals(target.getId()));
            addresses.save(a);
        });
        return target;
    }

    @Transactional
    public void remove(User user, Long addressId) {
        Address address = addresses.findByIdAndUserId(addressId, user.getId())
                .orElseThrow(() -> new ApiExceptions.NotFoundException("No address " + addressId));
        addresses.delete(address);

        // Removing the default promotes the oldest remaining address so a default always exists.
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            addresses.findByUserIdOrderByCreatedAtAsc(user.getId()).stream().findFirst()
                    .ifPresent(next -> {
                        next.setIsDefault(true);
                        addresses.save(next);
                    });
        }
    }
}
