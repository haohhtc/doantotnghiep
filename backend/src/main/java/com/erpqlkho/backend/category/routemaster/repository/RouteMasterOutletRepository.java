package com.erpqlkho.backend.category.routemaster.repository;

import com.erpqlkho.backend.category.routemaster.entity.RouteMasterOutlet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RouteMasterOutletRepository extends JpaRepository<RouteMasterOutlet, Long> {
    List<RouteMasterOutlet> findByRouteMasterId(Long routeMasterId);
    Optional<RouteMasterOutlet> findByRouteMasterIdAndCustomerId(Long routeMasterId, Long customerId);
    boolean existsByRouteMasterIdAndCustomerId(Long routeMasterId, Long customerId);
}
