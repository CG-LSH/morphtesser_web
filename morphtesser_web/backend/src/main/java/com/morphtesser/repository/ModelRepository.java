package com.morphtesser.repository;

import com.morphtesser.model.Model;
import com.morphtesser.model.NeuronModel;
import com.morphtesser.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModelRepository extends JpaRepository<NeuronModel, Long> {
    List<NeuronModel> findByUserOrderByCreatedAtDesc(User user);
    List<NeuronModel> findByIsPublicTrueOrderByCreatedAtDesc();
} 