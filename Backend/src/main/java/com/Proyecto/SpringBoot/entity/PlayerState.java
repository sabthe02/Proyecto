package com.Proyecto.SpringBoot.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class PlayerState {

    @Id
    private Long id;

    private float x;
    private float y;

    public PlayerState () {
    	
    }

    public Long getId() { 
    	return id; 
    }
    
    public void setId (Long id) { 
    	this.id = id; 
    }

    public float getX () { 
    	
    	return x; 
    }
    
    public void setX (float x) { 
    	
    	this.x = x; 
    }

    public float getY() { 
    	
    return y; 
    }
    
    public void setY(float y) { 
    	
    	this.y = y; 
    }
}
