package com.erpqlkho.backend.category.routemaster.repository;

import com.erpqlkho.backend.category.routemaster.entity.RouteSalesmanAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteSalesmanAssignmentRepository extends JpaRepository<RouteSalesmanAssignment, Long> {
    List<RouteSalesmanAssignment> findByRouteMasterIdOrderByEffectiveDateAsc(Long routeMasterId);
}
