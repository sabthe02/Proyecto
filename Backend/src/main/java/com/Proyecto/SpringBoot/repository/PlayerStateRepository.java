package com.Proyecto.SpringBoot.repository;

import com.Proyecto.SpringBoot.entity.PlayerState;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerStateRepository extends JpaRepository<PlayerState, Long> {
}
