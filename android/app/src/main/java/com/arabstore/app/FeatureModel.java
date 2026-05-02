package com.arabstore.app;

import java.io.Serializable;

public class FeatureModel implements Serializable {
    private String icon;
    private String title;
    private String desc;

    public FeatureModel() {
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDesc() {
        return desc;
    }

    public void setDesc(String desc) {
        this.desc = desc;
    }
}
