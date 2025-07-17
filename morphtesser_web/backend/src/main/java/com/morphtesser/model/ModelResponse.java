package com.morphtesser.model;

public class ModelResponse {
    private Long id;
    private String name;
    private String filePath;
    private String description;
    private String type;
    private String species;
    private String brainRegion;
    private Long userId;

    public ModelResponse(Model model) {
        this.id = model.getId();
        this.name = model.getName();
        this.filePath = model.getFilePath();
        this.description = model.getDescription();
        this.type = model.getType();
        this.species = model.getSpecies();
        this.brainRegion = model.getBrainRegion();
        this.userId = model.getUserId();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public String getBrainRegion() {
        return brainRegion;
    }

    public void setBrainRegion(String brainRegion) {
        this.brainRegion = brainRegion;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
} 