package com.morphtesser.repository;

import com.morphtesser.model.NeuronModel;
import com.morphtesser.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NeuronModelRepository extends JpaRepository<NeuronModel, Long> {
    List<NeuronModel> findByUser(User user);
} 