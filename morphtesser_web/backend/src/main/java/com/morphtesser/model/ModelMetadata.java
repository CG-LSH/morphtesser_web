package com.morphtesser.model;

public class ModelMetadata {
    private String name;
    private String description;
    private String type;
    private String species;
    private String brainRegion;

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
} 