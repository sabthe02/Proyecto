package com.Proyecto.SpringBoot.controller;

import com.Proyecto.SpringBoot.entity.PlayerState;
import com.Proyecto.SpringBoot.repository.PlayerStateRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/state")
@CrossOrigin
public class PlayerStateController {

    private final PlayerStateRepository repo;

    public PlayerStateController(PlayerStateRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    public PlayerState save(@RequestBody PlayerState state) {
        return repo.save(state);
    }

    @GetMapping("/{id}")
    public PlayerState get(@PathVariable Long id) {
        return repo.findById(id).orElse(null);
    }
}
