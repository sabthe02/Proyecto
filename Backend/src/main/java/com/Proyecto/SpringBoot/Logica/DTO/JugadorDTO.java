package com.Proyecto.SpringBoot.Logica.DTO;

public class JugadorDTO {

    String nickName;
    String id;

    public JugadorDTO(String id, String nickName)
    {
        this.nickName = nickName;
        this.id = id;
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public void setId(String id)
    {
        this.id = id;
    }

    public String getId()
    {
        return id;
    }

}
