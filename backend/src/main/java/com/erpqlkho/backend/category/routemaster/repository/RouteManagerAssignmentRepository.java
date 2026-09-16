package com.erpqlkho.backend.category.routemaster.repository;

import com.erpqlkho.backend.category.routemaster.entity.RouteManagerAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteManagerAssignmentRepository extends JpaRepository<RouteManagerAssignment, Long> {
    List<RouteManagerAssignment> findByRouteMasterIdOrderByEffectiveDateAsc(Long routeMasterId);
}
